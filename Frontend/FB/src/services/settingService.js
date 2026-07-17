import {
  getSettings as getSettingsApi,
  bulkUpdateSettings as bulkUpdateSettingsApi,
} from "../api/settingApi";

export const getSettings = async () => {
  const res = await getSettingsApi();
  return res.data.data;
};

export const saveSettings = async (settings) => {
  const res = await bulkUpdateSettingsApi(settings);
  return res.data;
};
