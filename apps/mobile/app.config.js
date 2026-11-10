const fs = require("node:fs");
const path = require("node:path");

module.exports = ({ config }) => {
  const soundPath = "./assets/ding.wav";
  const hasSound = fs.existsSync(
    path.join(__dirname, "assets", "ding.wav")
  );

  return {
    ...config,
    userInterfaceStyle: "automatic",
    extra: {
      ...(config.extra || {}),
      hasSignatureSound: hasSound,
      eas: {
        ...(config.extra?.eas || {}),
        projectId: "6496921f-4c3d-4381-abaa-69647c80866b"
      }
    },
    plugins: (config.plugins || []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "expo-notifications"
        ? [
            "expo-notifications",
            {
              ...plugin[1],
              ...(hasSound ? { sounds: [soundPath] } : {})
            }
          ]
        : plugin
    )
  };
};
