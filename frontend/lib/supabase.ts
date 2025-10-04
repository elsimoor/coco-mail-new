// Supabase has been removed from this project. To avoid requiring the
// @supabase/supabase-js package (which is no longer installed), we provide
// a stubbed supabase client here. If legacy code in your application
// imports this module, it will receive this stub instead of the real
// Supabase client. Attempting to call any of these stubbed methods will
// throw an error, indicating that Supabase functionality is unavailable.

export const supabase: any = {
  auth: {
    /**
     * Stubbed signUp method. Throws an error because Supabase is not
     * available in this project. Replace your Supabase integration with
     * the new authentication API provided by the backend.
     */
    signUp: async () => {
      throw new Error('Supabase has been removed from this project.');
    },
    /**
     * Stubbed signInWithPassword method. Throws an error because Supabase
     * is not available in this project.
     */
    signInWithPassword: async () => {
      throw new Error('Supabase has been removed from this project.');
    },
    /**
     * Stubbed signOut method. Throws an error because Supabase is not
     * available in this project.
     */
    signOut: async () => {
      throw new Error('Supabase has been removed from this project.');
    },
  },
};
