module.exports = ({ config }) => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      eas: {
        ...((config.extra && config.extra.eas) || {}),
        projectId: '3a98bc3a-7bce-402c-bd4d-b92524fe3bdd',
      },
      supabaseUrl,
      supabaseAnonKey,
    },
  };
};
