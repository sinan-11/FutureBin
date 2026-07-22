import Setting from "../models/Setting.js";

const DEFAULT_SETTINGS = {
  price_recyclable: {
    value: Number(process.env.PRICE_RECYCLABLE) || 8,
    description: "Price per kg for recyclable waste",
  },
  price_organic: {
    value: Number(process.env.PRICE_ORGANIC) || 3,
    description: "Price per kg for organic waste",
  },
  price_hazardous: {
    value: Number(process.env.PRICE_HAZARDOUS) || 15,
    description: "Price per kg for hazardous waste",
  },
  price_electronic: {
    value: Number(process.env.PRICE_ELECTRONIC) || 12,
    description: "Price per kg for electronic waste",
  },
  price_general: {
    value: Number(process.env.PRICE_GENERAL) || 5,
    description: "Price per kg for general waste",
  },
  pickup_price_per_kg: {
    value: Number(process.env.PICKUP_PRICE_PER_KG) || 5,
    description: "Default pickup price per kg",
  },
  pickup_search_radius: {
    value: Number(process.env.PICKUP_SEARCH_RADIUS) || 5000,
    description: "Search radius in meters for nearby collectors",
  },
  pickup_expiry_minutes: {
    value: Number(process.env.PICKUP_EXPIRY_MINUTES) || 30,
    description: "Minutes before a broadcasting request expires",
  },
  payment_buffer_percent: {
    value: Number(process.env.PAYMENT_BUFFER_PERCENT) || 20,
    description: "Percentage buffer added to estimated price for reservation",
  },
  payment_buffer_min: {
    value: Number(process.env.PAYMENT_BUFFER_MIN) || 10,
    description: "Minimum buffer amount in INR",
  },
  cancellation_fee_percent: {
    value: Number(process.env.CANCELLATION_FEE_PERCENT) || 10,
    description: "Percentage cancellation fee on estimated price",
  },
  cancellation_fee_min: {
    value: Number(process.env.CANCELLATION_FEE_MIN) || 5,
    description: "Minimum cancellation fee in INR",
  },
};

let cachedPrices = null;

export const seedSettings = async () => {
  for (const [key, { value, description }] of Object.entries(DEFAULT_SETTINGS)) {
    await Setting.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, value, description } },
      { upsert: true }
    );
  }
};

export const getSettings = async () => {
  const settings = await Setting.find().sort({ key: 1 });
  return settings;
};

export const getSettingsByKey = async (keys) => {
  const settings = await Setting.find({ key: { $in: keys } });
  const map = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  return map;
};

export const updateSetting = async (key, value) => {
  const setting = await Setting.findOneAndUpdate(
    { key },
    { $set: { value } },
    { new: true }
  );

  if (!setting) {
    throw new Error(`Setting "${key}" not found`);
  }

  cachedPrices = null;
  cachedPaymentConfig = null;

  return setting;
};

export const updateSettings = async (updates) => {
  const results = [];

  for (const [key, value] of Object.entries(updates)) {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true }
    );

    if (setting) {
      results.push(setting);
    }
  }

  cachedPrices = null;
  cachedPaymentConfig = null;

  return results;
};

export const getWastePrices = async () => {
  if (cachedPrices) return cachedPrices;

  const keys = [
    "price_recyclable",
    "price_organic",
    "price_hazardous",
    "price_electronic",
    "price_general",
    "pickup_price_per_kg",
  ];

  const map = await getSettingsByKey(keys);

  cachedPrices = {
    recyclable: Number(map.price_recyclable) || 8,
    organic: Number(map.price_organic) || 3,
    hazardous: Number(map.price_hazardous) || 15,
    electronic: Number(map.price_electronic) || 12,
    general: Number(map.price_general) || 5,
    defaultRate: Number(map.pickup_price_per_kg) || 5,
  };

  return cachedPrices;
};

export const invalidatePriceCache = () => {
  cachedPrices = null;
};

let cachedPaymentConfig = null;

export const getPaymentConfig = async () => {
  if (cachedPaymentConfig) return cachedPaymentConfig;

  const keys = [
    "payment_buffer_percent",
    "payment_buffer_min",
    "cancellation_fee_percent",
    "cancellation_fee_min",
  ];

  const map = await getSettingsByKey(keys);

  cachedPaymentConfig = {
    bufferPercent: Number(map.payment_buffer_percent) || 20,
    bufferMin: Number(map.payment_buffer_min) || 10,
    cancellationFeePercent: Number(map.cancellation_fee_percent) || 10,
    cancellationFeeMin: Number(map.cancellation_fee_min) || 5,
  };

  return cachedPaymentConfig;
};

export const invalidatePaymentConfigCache = () => {
  cachedPaymentConfig = null;
};
