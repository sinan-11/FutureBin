import {
  createSubscription,
  getSubscriptionsByResident,
  getSubscriptionById,
  editSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  deleteSubscription,
  getAllSubscriptionsForAdmin,
} from "../services/subscriptionService.js";

export const create = async (req, res) => {
  try {
    const subscription = await createSubscription(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const listMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await getSubscriptionsByResident(req.user.id);

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOne = async (req, res) => {
  try {
    const subscription = await getSubscriptionById(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    const status = error.status || 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const edit = async (req, res) => {
  try {
    const subscription = await editSubscription(req.params.id, req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const pause = async (req, res) => {
  try {
    const subscription = await pauseSubscription(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Subscription paused successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resume = async (req, res) => {
  try {
    const subscription = await resumeSubscription(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Subscription resumed successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancel = async (req, res) => {
  try {
    const subscription = await cancelSubscription(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteSubscription(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminListAll = async (req, res) => {
  try {
    const subscriptions = await getAllSubscriptionsForAdmin();

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
