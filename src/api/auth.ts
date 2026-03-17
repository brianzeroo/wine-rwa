export interface User {
    id: string;
    phone: string;
    name: string;
}

export const registerUser = async (phone: string, pin: string, name: string = 'User'): Promise<User> => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, pin, name })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.user;
};

export const loginUser = async (phone: string, pin: string): Promise<User | null> => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, pin })
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.user;
};
