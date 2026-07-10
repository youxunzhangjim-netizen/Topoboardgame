import { EDITION } from "./EditionConfig.js";

export const SUPPORT_LINKS = Object.freeze({
  officialPage: "/official/",
  supportPage: "/support/",
  steamPage: "",
  discordInvite: "",
  githubRepo: "https://github.com/youxunzhangjim-netizen/Topoboardgame",
  contactEmail: "",
  githubSponsors: "",
  koFi: "",
  patreon: "",
  buyMeACoffee: "BUY_ME_A_COFFEE_URL_HERE",
  customDonation: ""
});

export function getEnabledDonationLinks(options = {}) {
  const hideForSteamApp = options.hideForSteamApp !== false;
  if (hideForSteamApp && EDITION.isSteam) return [];

  return [
    { id: "buyMeACoffee", label: "Support on Buy Me a Coffee", labelZh: "透過 Buy Me a Coffee 支持", url: SUPPORT_LINKS.buyMeACoffee },
    { id: "githubSponsors", label: "GitHub Sponsors", labelZh: "GitHub Sponsors", url: SUPPORT_LINKS.githubSponsors },
    { id: "koFi", label: "Ko-fi", labelZh: "Ko-fi", url: SUPPORT_LINKS.koFi },
    { id: "patreon", label: "Patreon", labelZh: "Patreon", url: SUPPORT_LINKS.patreon },
    { id: "customDonation", label: "Support Development", url: SUPPORT_LINKS.customDonation }
  ].filter((item) => item.url && !item.url.includes("HERE"));
}
