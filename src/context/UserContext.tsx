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
}

interface UserContextType {
    user: UserProfile | null;
    role: UserRole;
    isAuthenticated: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
    updateTheme: (theme: 'light' | 'dark' | 'contrast') => void;
    spendDowdBucks: (amount: number, itemId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole>(null);

    // Load from local storage on mount (mock persistence)
    useEffect(() => {
        const storedRole = localStorage.getItem('erc-role') as UserRole;
        if (storedRole) {
            setRole(storedRole);
            // Mock user data
            setUser({
                id: '1',
                name: storedRole === 'student' ? 'Student Name' : 'Teacher Name',
                themePreference: (localStorage.getItem('erc-theme') as any) || 'dark',
                balance: parseInt(localStorage.getItem('erc-balance') || '450'),
                inventory: JSON.parse(localStorage.getItem('erc-inventory') || '[]'),
                level: storedRole === 'student' ? 'Level 3' : undefined,
                year: storedRole === 'student' ? 'Year 1' : undefined,
            });
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
        const newUser: UserProfile = {
            id: '1',
            name: newRole === 'student' ? 'Student Name' : 'Teacher Name',
            themePreference: 'dark',
            balance: 450,
            inventory: [],
        };
        setUser(newUser);
        localStorage.setItem('erc-role', newRole || '');
        localStorage.setItem('erc-balance', '450');
        localStorage.setItem('erc-inventory', '[]');
    };

    const logout = () => {
        setRole(null);
        setUser(null);
        localStorage.removeItem('erc-role');
    };

    const updateTheme = (theme: 'light' | 'dark' | 'contrast') => {
        if (user) {
            const updatedUser = { ...user, themePreference: theme };
            setUser(updatedUser);
            localStorage.setItem('erc-theme', theme);
        }
    };

    const spendDowdBucks = (amount: number, itemId: string) => {
        if (!user || user.balance < amount) return false;

        const updatedUser = {
            ...user,
            balance: user.balance - amount,
            inventory: [...user.inventory, itemId]
        };
        setUser(updatedUser);
        localStorage.setItem('erc-balance', updatedUser.balance.toString());
        localStorage.setItem('erc-inventory', JSON.stringify(updatedUser.inventory));
        return true;
    };

    return (
        <UserContext.Provider value={{
            user, role, isAuthenticated: !!role, login, logout, updateTheme, spendDowdBucks
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
