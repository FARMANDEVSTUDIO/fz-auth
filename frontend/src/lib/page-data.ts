import { cache } from 'react';
import { requireOwner } from './session';
import { getAppsForOwner, getSelectedApp, App } from './apps';
import { Owner } from './owners';

export const getPageData = cache(async (): Promise<{
  owner: Owner;
  apps: App[];
  selected: App | null;
}> => {
  const owner = await requireOwner();
  const [apps, selected] = await Promise.all([
    getAppsForOwner(owner.id),
    getSelectedApp(owner.id),
  ]);
  return { owner, apps, selected };
});
