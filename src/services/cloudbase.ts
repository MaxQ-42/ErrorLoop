/** CloudBase adapter boundary. UI only speaks to repository models; enable this after setting VITE_CLOUDBASE_ENV_ID. */
export const cloudBaseConfig = { environmentId: import.meta.env.VITE_CLOUDBASE_ENV_ID as string | undefined, enabled: Boolean(import.meta.env.VITE_CLOUDBASE_ENV_ID) }
export const cloudStoragePath = (userId:string, kind:'questions'|'papers', recordId:string, variant:'original'|'scanned', order:number) => `users/${userId}/${kind}/${recordId}/${variant}/${String(order).padStart(3,'0')}.webp`
