import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'student' | 'teacher' | 'admin' | null;

interface UserProfile {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    themePreference: 'light' | 'dark' | 'contrast';
    balance: number;
    inventory: string[]; // List of item IDs purchased
    cohort?: 'Level 2' | 'Level 3A' | 'Level 3B';
    xp: number;
    levelNumber: number; // Actual numeric level (e.g. 1, 2, 5)
    department?: 'music' | 'performing_arts'; // Added

    // Accessibility
    fontSizePreference?: 'normal' | 'large' | 'xl';
    colorProfile?: 'standard' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    language: 'en-gb'; // Changed to be required and default to 'en-gb'

    // Auth fields (mocked)
    password?: string;
    isFirstLogin: boolean;
    requires2FA?: boolean;
}

interface UserContextType {
    user: UserProfile | null;
    role: UserRole;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requires2FA?: boolean; firstLogin?: boolean }>;
    changePassword: (newPassword: string) => Promise<boolean>;
    resetStudentPassword: (studentId: string, newPassword?: string) => Promise<boolean>;
    quickLogin: (role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    updateTheme: (theme: 'light' | 'dark' | 'contrast') => Promise<void>;
    spendDowdBucks: (amount: number, itemId: string) => Promise<boolean>;
    addXp: (amount: number) => Promise<void>;
    updateAvatar: (avatar: string) => Promise<void>;
    addDowdBucks: (amount: number) => Promise<void>;
    updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
    completeFirstLogin: () => Promise<void>;
    verifyMasterPassword: (password: string) => Promise<boolean>;
    updateMasterPassword: (newPassword: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Profile fetching helper
    const fetchProfile = async (userId: string) => {
        const start = performance.now();
        console.log('Fetching profile for:', userId);

        try {
            // Fetch everything in one go. If columns change, we handle it gracefully.
            const { data, error } = await supabase.from('profiles')
                .select('id, name, username, avatar, theme_preference, balance, inventory, cohort, xp, department, is_first_login, role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('UserContext: Error fetching profile:', error.message);

                // Fallback for column mismatch
                if (error.message?.includes('column')) {
                    const { data: minimalData } = await supabase
                        .from('profiles')
                        .select('id, name, role, is_first_login, department')
                        .eq('id', userId)
                        .single();

                    if (minimalData) {
                        return {
                            ...minimalData,
                            username: userId,
                            avatar: null,
                            theme_preference: 'dark',
                            balance: 0,
                            inventory: [],
                            cohort: 'None',
                            xp: 0
                        };
                    }
                }
                return null;
            }

            const end = performance.now();
            console.log(`UserContext: Profile fetched in ${(end - start).toFixed(2)}ms`);
            return data;
        } catch (e) {
            console.error('Exception in fetchProfile:', e);
            return null;
        }
    };

    const initializingUserId = React.useRef<string | null>(null);

    // Shared initialization logic
    const initializeUser = async (session: any) => {
        if (!session?.user?.id) {
            setUser(null);
            setRole(null);
            initializingUserId.current = null;
            return;
        }

        if (initializingUserId.current === session.user.id && user) {
            console.log('UserContext: Already initialized for this user');
            return;
        }

        initializingUserId.current = session.user.id;

        try {
            const profile = await fetchProfile(session.user.id);
            if (profile) {
                const mappedUser: UserProfile = {
                    id: session.user.id,
                    name: profile.name || session.user.user_metadata?.full_name || 'User',
                    username: profile.username || session.user.email?.split('@')[0] || 'user',
                    avatar: profile.avatar,
                    themePreference: (profile.theme_preference as any) || 'dark',
                    balance: profile.balance || 0,
                    inventory: profile.inventory || [],
                    cohort: profile.cohort,
                    xp: profile.xp || 0,
                    levelNumber: Math.floor((profile.xp || 0) / 250) + 1,
                    department: profile.department || 'music',
                    isFirstLogin: !!profile.is_first_login,
                    language: 'en-gb',
                };
                setUser(mappedUser);
                setRole((profile.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'student');
                console.log('User initialized successfully');
            } else {
                console.warn('UserContext: Profile not found for session user. Setting partial user.');
                // Create a partial user to allow Login.tsx to handle the "missing profile" state
                const partialUser: any = {
                    id: session.user.id,
                    name: session.user.user_metadata?.full_name || 'User',
                    username: session.user.email?.split('@')[0] || 'user',
                    themePreference: 'dark',
                    isFirstLogin: false,
                    language: 'en-gb'
                };
                setUser(partialUser);
                setRole(null); // Explicitly set role to null so Login.tsx knows there's a problem
            }
        } catch (error) {
            console.error('Error during user initialization:', error);
        } finally {
            if (initializingUserId.current === session.user.id) {
                console.log('UserContext: initialization complete, setting isLoading to false');
                setIsLoading(false);
            }
        }
    };

    // Load session and profiles on mount
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('UserContext init: session found:', !!session);
                if (mounted && session) {
                    await initializeUser(session);
                } else if (mounted && !session) {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error in UserContext init:', error);
                if (mounted) setIsLoading(false);
            }
        };

        init();

        // 3. Fail-safe timer: Force stop loading after 5 seconds no matter what
        const failSafeTimer = setTimeout(() => {
            if (mounted) {
                console.warn('🕒 Loading Fail-safe triggered: Forcing isLoading to false after 20s.');
                setIsLoading(false);
            }
        }, 20000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            if (!mounted) return;

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session) {
                    // Don't await initializeUser to avoid blocking the auth state transition
                    initializeUser(session).catch(err => console.error('Error initializing user after event:', err));
                }
            } else if (event === 'SIGNED_OUT') {
                initializingUserId.current = null;
                setUser(null);
                setRole(null);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(failSafeTimer);
        };
    }, []);

    // Apply theme to body
    // Apply theme and accessibility to body/html
    useEffect(() => {
        document.body.className = ''; // Reset body classes
        document.documentElement.className = ''; // Reset html classes

        // Theme
        if (user?.themePreference === 'dark') document.body.classList.add('theme-dark');
        if (user?.themePreference === 'contrast') document.body.classList.add('theme-contrast');

        // Color Blindness
        if (user?.colorProfile && user.colorProfile !== 'standard') {
            document.body.classList.add(`theme-${user.colorProfile}`);
        }

        // Font Size
        if (user?.fontSizePreference === 'large') document.documentElement.classList.add('font-large');
        if (user?.fontSizePreference === 'xl') document.documentElement.classList.add('font-xl');

    }, [user?.themePreference, user?.colorProfile, user?.fontSizePreference]);



    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requires2FA?: boolean; firstLogin?: boolean }> => {
        console.log('Login attempt started for:', email);
        try {
            // Add a deadline for the auth call
            const authPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('Authentication service timeout (30s)')), 30000)
            );

            console.log('UserContext: Waiting for Supabase signInWithPassword...');
            const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
            console.log('UserContext: signInWithPassword call finished. Success:', !!data?.user, 'Error:', error?.message || 'none');

            if (error) {
                return { success: false, error: error.message };
            }

            // Immediately check if we have a session. If so, start initializing but don't block the return.
            if (data?.session) {
                console.log('UserContext: Login success, triggering non-blocking initializeUser');
                initializeUser(data.session).catch(e => console.error('Async init failed:', e));
            }

            return { success: true };
        } catch (e: any) {
            console.error('UserContext: Exception in login:', e);
            return { success: false, error: e.message || 'Authentication service error' };
        }
    };




    const changePassword = async (newPassword: string): Promise<boolean> => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) {
                console.error('UserContext: Error updating password:', error.message);
                return false;
            }
            console.log('UserContext: Password updated successfully');
            return true;
        } catch (e: any) {
            console.error('UserContext: Exception in changePassword:', e);
            return false;
        }
    };

    const resetStudentPassword = async (studentId: string, newPassword?: string): Promise<boolean> => {
        try {
            const passwordToSet = newPassword || 'password123'; // Default fallback if not provided

            const { error } = await supabase.rpc('admin_reset_password', {
                target_user_id: studentId,
                new_password: passwordToSet
            });

            if (error) {
                console.error('UserContext: Error resetting password:', error.message);
                return false;
            }

            console.log(`UserContext: Password reset successfully for student ${studentId}`);
            return true;
        } catch (e: any) {
            console.error('UserContext: Exception in resetStudentPassword:', e);
            return false;
        }
    };

    const quickLogin = async (targetRole: UserRole) => {
        if (!targetRole) return;
        // Logic for quick login removed in favor of real Supabase Auth
        console.warn('Quick login is deprecated. Use real Supabase Auth.');
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setUser(null);
    };

    const updateTheme = async (theme: 'light' | 'dark' | 'contrast') => {
        if (user && role) {
            const updatedUser = { ...user, themePreference: theme };
            setUser(updatedUser);
            await supabase
                .from('profiles')
                .update({ theme_preference: theme })
                .eq('id', user.id);
        }
    };

    const spendDowdBucks = async (amount: number, itemId: string) => {
        if (!user || !role || user.balance < amount) return false;

        const newBalance = user.balance - amount;
        const newInventory = [...user.inventory, itemId];

        const updatedUser = {
            ...user,
            balance: newBalance,
            inventory: newInventory
        };
        setUser(updatedUser);

        const { error } = await supabase
            .from('profiles')
            .update({ balance: newBalance, inventory: newInventory })
            .eq('id', user.id);

        return !error;
    };

    const addXp = async (amount: number) => {
        if (!user || !role) return;

        const newXp = (user.xp || 0) + amount;
        const newLevelNumber = Math.floor(newXp / 250) + 1;

        const updatedUser = {
            ...user,
            xp: newXp,
            levelNumber: newLevelNumber
        };

        setUser(updatedUser);

        await supabase
            .from('profiles')
            .update({ xp: newXp })
            .eq('id', user.id);

        console.log(`Gained ${amount} XP! New Total: ${newXp}, Level: ${newLevelNumber}`);
    };

    const addDowdBucks = async (amount: number) => {
        if (!user || !role) return;
        const newBalance = (user.balance || 0) + amount;
        const updatedUser = {
            ...user,
            balance: newBalance
        };
        setUser(updatedUser);
        await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);
    };

    const updateAvatar = async (avatar: string) => {
        if (!user || !role) return;
        const updatedUser = { ...user, avatar };
        setUser(updatedUser);
        await supabase
            .from('profiles')
            .update({ avatar })
            .eq('id', user.id);
    };

    const updateProfile = async (profileData: Partial<UserProfile>) => {
        if (!user || !role) return;
        const updatedUser = { ...user, ...profileData };
        setUser(updatedUser);

        // Map camelCase to snake_case for Supabase
        const dbData: any = {};
        if (profileData.name) dbData.name = profileData.name;
        if (profileData.username) dbData.username = profileData.username;
        if (profileData.themePreference) dbData.theme_preference = profileData.themePreference;
        if (profileData.cohort) dbData.cohort = profileData.cohort;
        if (profileData.department) dbData.department = profileData.department;
        if (profileData.avatar) dbData.avatar = profileData.avatar;

        if (Object.keys(dbData).length > 0) {
            const { error } = await supabase
                .from('profiles')
                .update(dbData)
                .eq('id', user.id);

            if (error) {
                console.error('UserContext: Error updating profile:', error);
                if (error.code === '23505' || error.message?.includes('unique constraint')) {
                    alert('This username is already taken. Please choose another one.');
                    // Revert local state if needed, though for now we just alert
                } else {
                    alert('Failed to update profile. Please try again.');
                }
            }
        }
    };

    const completeFirstLogin = async () => {
        if (!user) return;
        const updatedUser = { ...user, isFirstLogin: false };
        setUser(updatedUser);
        await supabase
            .from('profiles')
            .update({ is_first_login: false })
            .eq('id', user.id);
    };

    const verifyMasterPassword = async (password: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.rpc('verify_master_password', { attempt: password });
            if (error) {
                console.error('UserContext: Error verifying master password:', error);
                return false;
            }
            return !!data;
        } catch (e) {
            console.error('UserContext: Exception in verifyMasterPassword:', e);
            return false;
        }
    };

    const updateMasterPassword = async (newPassword: string): Promise<boolean> => {
        if (role !== 'admin') return false;

        try {
            const { error } = await supabase.rpc('set_master_password', { new_password: newPassword });

            if (error) {
                console.error('UserContext: Error updating master password:', error);
                return false;
            }
            console.log('UserContext: Master password updated (hashed)');
            return true;
        } catch (e) {
            console.error('UserContext: Exception updating master password:', e);
            return false;
        }
    };

    return (
        <UserContext.Provider value={{
            user, role, isAuthenticated: !!user, isLoading, login, changePassword, resetStudentPassword, quickLogin, logout, updateTheme, spendDowdBucks, addXp, updateAvatar, addDowdBucks, updateProfile, completeFirstLogin, verifyMasterPassword, updateMasterPassword
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
