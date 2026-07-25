import cron from "node-cron";
import dayjs from "dayjs";
import Subscription from "../models/Subscription.js";
import PickupRequest from "../models/PickupRequest.js";
import User from "../models/User.js";
import { createPickupRequest } from "../services/pickupService.js";
import { computeNextRunAt } from "../utils/subscriptionScheduler.js";
import {
  notifyCollectorsByIds,
  notifyResidentById,
} from "../config/socket.js";
import {
  sendSubscriptionInsufficientBalanceEmail,
  sendSubscriptionPickupSkippedEmail,
} from "../utils/sendEmail.js";

const STALE_LOCK_MINUTES = 10;
const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_CONCURRENCY =
  Number(process.env.SUBSCRIPTION_CONCURRENCY) || 5;

const processWithConcurrency = async (items, fn, limit) => {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = fn(item).then((result) => {
      executing.delete(promise);
      return result;
    });
    executing.add(promise);
    results.push(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.allSettled(results);
};

const releaseStaleLocks = async () => {
  const cutoff = dayjs().subtract(STALE_LOCK_MINUTES, "minute").toDate();
  const result = await Subscription.updateMany(
    { processingLock: true, lockedAt: { $lte: cutoff } },
    { $set: { processingLock: false, lockedAt: null } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[SUB-CRON] Released ${result.modifiedCount} stale lock(s)`);
  }
};

const processSubscription = async (subscription) => {
  const now = new Date();

  const claimed = await Subscription.findOneAndUpdate(
    {
      _id: subscription._id,
      status: "active",
      nextRunAt: { $lte: now },
      processingLock: { $ne: true },
    },
    { $set: { processingLock: true, lockedAt: now } },
    { new: true }
  );

  if (!claimed) return false;

  try {
    const activePickup = await PickupRequest.findOne({
      subscriptionId: claimed._id,
      status: { $in: [
        "pending", "broadcasting", "accepted",
        "collector_arrived", "weight_verified", "awaiting_extra_payment",
      ]},
    }).select("_id status");

    if (activePickup) {
      const shouldNotify =
        !claimed.lastSkippedActivePickupNotifyAt ||
        dayjs(now).diff(dayjs(claimed.lastSkippedActivePickupNotifyAt), "millisecond") > NOTIFICATION_COOLDOWN_MS;

      if (shouldNotify) {
        claimed.lastSkippedActivePickupNotifyAt = now;
        await claimed.save();

        try {
          const resident = await User.findById(claimed.resident).select("name email");
          if (resident) {
            notifyResidentById(claimed.resident, "subscription-pickup-skipped", {
              subscriptionId: claimed._id,
              message: "Your scheduled pickup is waiting because a previous pickup from this subscription hasn't completed yet.",
            });
            sendSubscriptionPickupSkippedEmail(
              resident.email,
              resident.name,
              claimed.frequency
            ).catch(() => {});
          }
        } catch {
          // notification failure should not block processing
        }
      }

      await Subscription.findByIdAndUpdate(claimed._id, {
        $set: { processingLock: false, lockedAt: null },
      });
      return false;
    }

    let pickupData;
    try {
      pickupData = await createPickupRequest(
        {
          wasteType: claimed.wasteType,
          estimatedWeight: claimed.estimatedWeight,
          pickupAddress: claimed.address?.full || claimed.address?.street || "",
          coordinates: claimed.location.coordinates,
          description: "",
          images: claimed.images || [],
          scheduledAt: null,
          paymentMethod: claimed.paymentMethod,
        },
        claimed.resident
      );
    } catch (error) {
      if (error.message === "INSUFFICIENT_BALANCE") {
        const shouldNotify =
          !claimed.lastInsufficientNotifyAt ||
          dayjs(now).diff(dayjs(claimed.lastInsufficientNotifyAt), "millisecond") > NOTIFICATION_COOLDOWN_MS;

        const updateOps = {
          $set: { processingLock: false, lockedAt: null },
          $inc: { consecutiveFailures: 1 },
        };

        if (shouldNotify) {
          updateOps.$set.lastInsufficientNotifyAt = now;
        }

        await Subscription.findByIdAndUpdate(claimed._id, updateOps);

        if (shouldNotify) {
          try {
            const resident = await User.findById(claimed.resident).select("name email");
            if (resident) {
              notifyResidentById(claimed.resident, "subscription-insufficient-balance", {
                subscriptionId: claimed._id,
                message: "Unable to create your scheduled pickup because your wallet balance is insufficient. Please top up your wallet.",
              });
              sendSubscriptionInsufficientBalanceEmail(
                resident.email,
                resident.name,
                claimed.frequency
              ).catch(() => {});
            }
          } catch {
            // notification failure should not block
          }
        }

        return false;
      }
      throw error;
    }

    if (pickupData?.request) {
      const request = pickupData.request;
      const nearbyCollectors = pickupData.nearbyCollectors || [];

      if (nearbyCollectors.length > 0) {
        notifyCollectorsByIds(nearbyCollectors, "new-request", {
          request,
          nearbyCollectors,
        });
      }

      notifyResidentById(claimed.resident, "subscription-pickup-created", {
        subscriptionId: claimed._id,
        request,
      });
    }

    const newNextRunAt = computeNextRunAt(claimed);

    await Subscription.findByIdAndUpdate(claimed._id, {
      $set: {
        lastRunAt: now,
        nextRunAt: newNextRunAt,
        lastPickupRequest: pickupData?.request?._id || null,
        consecutiveFailures: 0,
        processingLock: false,
        lockedAt: null,
      },
    });

    return true;
  } catch (error) {
    await Subscription.findByIdAndUpdate(claimed._id, {
      $set: { processingLock: false, lockedAt: null },
    });
    throw error;
  }
};

export const startSubscriptionCron = () => {
  cron.schedule("* * * * *", async () => {
    const startTime = Date.now();
    console.log("[SUB-CRON] Starting subscription cron run");

    try {
      await releaseStaleLocks();

      const now = new Date();
      const pendingSubscriptions = await Subscription.find({
        status: "active",
        nextRunAt: { $lte: now },
        processingLock: { $ne: true },
      }).select("_id resident frequency wasteType").sort({ nextRunAt: 1 }).lean();

      const total = pendingSubscriptions.length;
      console.log(`[SUB-CRON] Found ${total} subscription(s) to process`);

      if (total === 0) {
        console.log(`[SUB-CRON] Run complete: 0 created, 0 skipped, 0 errors, ${Date.now() - startTime}ms`);
        return;
      }

      const results = await processWithConcurrency(
        pendingSubscriptions,
        processSubscription,
        SUBSCRIPTION_CONCURRENCY
      );

      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const result of results) {
        if (result.status === "fulfilled") {
          if (result.value) {
            created++;
          } else {
            skipped++;
          }
        } else {
          errors++;
          console.error(`[SUB-CRON] Subscription processing failed: ${result.reason?.message || result.reason}`);
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(
        `[SUB-CRON] Run complete: ${created} created, ${skipped} skipped, ${errors} errors, ${elapsed}ms`
      );
    } catch (error) {
      console.error(`[SUB-CRON] Fatal cron error: ${error.message}`);
    }
  });

  console.log(`[SUB-CRON] Subscription cron scheduled (every minute, concurrency: ${SUBSCRIPTION_CONCURRENCY})`);
};
