export interface JwtUser {
    id: number
    strategy: 'email' | 'otp' | 'google'
    identity: string
    cloud: number
    domain: number
    isEmailValidated: boolean
    isMobileValidated: boolean
    profile: {
        userId: number
        accountType: number
        firstName: string
        lastName: string
        nationalCode: string
        status: number
        address: string
        companyName: string
        economicCode: string
        isNationalCodeValidated: boolean
        createdAt: Date | string
    }
    selectedSpace: {
        id: number
        projectId: number
        ownerId: number
        name: string
        SpaceRoles: {
            id: number
            spaceId: number
            role: string
        }[]
    } | null
    spaces: {
        id: number
        projectId: number
        ownerId: number
        name: string
        SpaceRoles: {
            id: number
            spaceId: number
            role: string
        }[]
    }[]
    departments: {
        id: number
        name: string
    }[]
    iat: number
    exp: number
}
