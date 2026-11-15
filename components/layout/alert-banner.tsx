import { getAlertBanner, getFlags } from "@lib/data/site";
import { DismissibleBanner } from "./dismissible-banner";

/** Site-wide announcement strip, managed in Admin → Site. */
export async function AlertBanner() {
  const [flags, banner] = await Promise.all([getFlags(), getAlertBanner()]);
  if (!flags.showAlertBanner || !banner?.enabled) return null;
  return (
    <DismissibleBanner id={banner.updatedAt} backgroundColor={banner.backgroundColor} textColor={banner.textColor}>
      {banner.message}
      {banner.code && <strong className="ml-2 font-extrabold tracking-wide">{banner.code}</strong>}
    </DismissibleBanner>
  );
}
