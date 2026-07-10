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
  buyMeACoffee: "",
  customDonation: ""
});

export function getEnabledDonationLinks(options = {}) {
  const hideForSteamApp = options.hideForSteamApp !== false;
  if (hideForSteamApp && EDITION.isSteam) return [];

  return [
    { id: "githubSponsors", label: "GitHub Sponsors", url: SUPPORT_LINKS.githubSponsors },
    { id: "koFi", label: "Ko-fi", url: SUPPORT_LINKS.koFi },
    { id: "patreon", label: "Patreon", url: SUPPORT_LINKS.patreon },
    { id: "buyMeACoffee", label: "Buy Me a Coffee", url: SUPPORT_LINKS.buyMeACoffee },
    { id: "customDonation", label: "Support Development", url: SUPPORT_LINKS.customDonation }
  ].filter((item) => item.url && !item.url.includes("HERE"));
}
