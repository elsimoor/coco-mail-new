// This file acts as a thin wrapper around the main AuthContext in
// `contexts/AuthContext.tsx`. Some parts of the application still import
// from `../context/AuthContext`, so to maintain compatibility we simply
// re-export the AuthProvider and useAuth hook from the correct module.

export { AuthProvider, useAuth } from '../contexts/AuthContext';