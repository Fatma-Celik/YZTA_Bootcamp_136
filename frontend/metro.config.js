const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, {
  // Metro'ya CSS dosyalarını ve web/native ayrımını yapabilmesi için destek açıyoruz
  isCSSEnabled: true,
});

module.exports = withNativeWind(config, { input: "./global.css", cliCommand: "npx tailwindcss" });