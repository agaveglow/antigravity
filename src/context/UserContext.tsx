import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'student' | 'teacher' | 'admin' | null;

interface UserProfile {
    id: string;
    name: string;
    avatar?: string;
    themePreference: 'light' | 'dark' | 'contrast';
    balance: number;
    inventory: string[]; // List of item IDs purchased
    level?: 'Level 2' | 'Level 3';
    year?: 'Year 1' | 'Year 2';
    xp: number;
    levelNumber: number; // Actual numeric level (e.g. 1, 2, 5)
}

interface UserContextType {
    user: UserProfile | null;
    role: UserRole;
    isAuthenticated: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
    updateTheme: (theme: 'light' | 'dark' | 'contrast') => void;
    spendDowdBucks: (amount: number, itemId: string) => boolean;
    addXp: (amount: number) => void;
    updateAvatar: (avatar: string) => void;
    addDowdBucks: (amount: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole>(null);

    // Load from local storage on mount
    useEffect(() => {
        const storedRole = localStorage.getItem('erc-role') as UserRole;
        if (storedRole) {
            setRole(storedRole);
            // Load user data from role-specific storage
            const storageKey = `erc-user-${storedRole}`;
            const storedUserData = localStorage.getItem(storageKey);

            if (storedUserData) {
                const parsedUser = JSON.parse(storedUserData);
                // Force recalculate level based on new 250 XP threshold
                const expectedLevel = Math.floor((parsedUser.xp || 0) / 250) + 1;
                if (parsedUser.levelNumber !== expectedLevel) {
                    parsedUser.levelNumber = expectedLevel;
                    localStorage.setItem(storageKey, JSON.stringify(parsedUser));
                }
                setUser(parsedUser);
            } else {
                // Fallback to old storage format for backwards compatibility
                const fallbackUser: UserProfile = {
                    id: storedRole === 'student' ? '1' : 'teacher-1',
                    name: storedRole === 'student' ? 'Student Name' : 'Teacher Name',
                    themePreference: (localStorage.getItem('erc-theme') as any) || 'dark',
                    balance: parseInt(localStorage.getItem('erc-balance') || '450'),
                    inventory: JSON.parse(localStorage.getItem('erc-inventory') || '[]'),
                    level: storedRole === 'student' ? 'Level 3' : undefined,
                    year: storedRole === 'student' ? 'Year 1' : undefined,
                    xp: 0,
                    levelNumber: 1,
                };
                setUser(fallbackUser);
                localStorage.setItem(storageKey, JSON.stringify(fallbackUser));
            }
        }
    }, []);

    // Apply theme to body
    useEffect(() => {
        document.body.className = ''; // Reset
        if (user?.themePreference === 'dark') document.body.classList.add('theme-dark');
        if (user?.themePreference === 'contrast') document.body.classList.add('theme-contrast');
    }, [user?.themePreference]);

    const login = (newRole: UserRole) => {
        setRole(newRole);

        // Load existing user data from localStorage or create new
        const storageKey = `erc-user-${newRole}`;
        const storedUserData = localStorage.getItem(storageKey);

        let newUser: UserProfile;
        if (storedUserData) {
            // Restore existing user data
            newUser = JSON.parse(storedUserData);
        } else {
            // Create new user with defaults
            newUser = {
                id: newRole === 'student' ? '1' : 'teacher-1',
                name: newRole === 'student' ? 'Student Name' : 'Teacher Name',
                themePreference: 'dark',
                balance: 450,
                inventory: [],
                level: newRole === 'student' ? 'Level 3' : undefined,
                year: newRole === 'student' ? 'Year 1' : undefined,
                xp: 0,
                levelNumber: 1,
            };
            // Save new user data
            localStorage.setItem(storageKey, JSON.stringify(newUser));
        }

        setUser(newUser);
        localStorage.setItem('erc-role', newRole || '');
    };

    const logout = () => {
        setRole(null);
        setUser(null);
        localStorage.removeItem('erc-role');
    };

    const updateTheme = (theme: 'light' | 'dark' | 'contrast') => {
        if (user && role) {
            const updatedUser = { ...user, themePreference: theme };
            setUser(updatedUser);
            const storageKey = `erc-user-${role}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedUser));
        }
    };

    const spendDowdBucks = (amount: number, itemId: string) => {
        if (!user || !role || user.balance < amount) return false;

        const updatedUser = {
            ...user,
            balance: user.balance - amount,
            inventory: [...user.inventory, itemId]
        };
        setUser(updatedUser);
        const storageKey = `erc-user-${role}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedUser));
        return true;
    };

    const addXp = (amount: number) => {
        if (!user || !role) return;

        const newXp = (user.xp || 0) + amount;
        // Simple leveling logic: Level up every 250 XP (Reduced from 1000)
        const newLevelNumber = Math.floor(newXp / 250) + 1;

        const updatedUser = {
            ...user,
            xp: newXp,
            levelNumber: newLevelNumber
        };

        setUser(updatedUser);
        const storageKey = `erc-user-${role}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedUser));

        // Could trigger a toast or notification here
        console.log(`Gained ${amount} XP! New Total: ${newXp}, Level: ${newLevelNumber}`);
        console.log(`Gained ${amount} XP! New Total: ${newXp}, Level: ${newLevelNumber}`);
    };

    const addDowdBucks = (amount: number) => {
        if (!user || !role) return;
        const updatedUser = {
            ...user,
            balance: (user.balance || 0) + amount
        };
        setUser(updatedUser);
        const storageKey = `erc-user-${role}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedUser));
    };

    const updateAvatar = (avatar: string) => {
        if (!user || !role) return;
        const updatedUser = { ...user, avatar };
        setUser(updatedUser);
        const storageKey = `erc-user-${role}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedUser));
    };

    return (
        <UserContext.Provider value={{
            user, role, isAuthenticated: !!role, login, logout, updateTheme, spendDowdBucks, addXp, updateAvatar, addDowdBucks
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
