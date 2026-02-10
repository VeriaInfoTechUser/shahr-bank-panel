// utils.ts

import {JwtUser} from "../types/jwt-user.interface";

/**
 * Set a cookie with a given name, value, and expiration time.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} expiration - The expiration time in seconds.
 */
export function setCookie(name: string, value: string, expiration: number): void {
    const expires = new Date(Date.now() + expiration * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

/**
 * Get the value of a cookie by name.
 * @param {string} name - The name of the cookie.
 * @returns {string | null} - The value of the cookie or null if not found.
 */
export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
    return null;
}

/**
 * Erase a cookie by name.
 * @param {string} name - The name of the cookie.
 */
export function eraseCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Set the current user in localStorage.
 * @param {object | null} user - The user object to store or null to clear.
 */
export function setCurrentUser(user: object | null): void {
    localStorage.removeItem('currentUser');
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

/**
 * Get the current user from localStorage.
 * @returns {object | null} - The user object or null if not found.
 */
export function getCurrentUser(): object | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

/**
 * Set the jwt body in localStorage.
 * @returns {object | null} - The user object or null if not found.
 */
export function setJwtBody(body: object | null): void {
    localStorage.removeItem('jwtBody');
    if (body) {
        localStorage.setItem('jwtBody', JSON.stringify(body));
    } else {
        localStorage.removeItem('jwtBody');
    }
}

/**
 * Get the jwt body from localStorage.
 * @returns {object | null} - The user object or null if not found.
 */
export function getJwtBody(): JwtUser | null {
    const body = localStorage.getItem('jwtBody');
    return body ? JSON.parse(body) : null;
}
