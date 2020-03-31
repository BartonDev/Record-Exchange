export module IdHash {

    function numberToCharacter(num: number): string{
        if (num < 0 || num > 61) { return "" }
        if (num >= 0 && num < 10 ){ return num.toString() }
        return characterValues[num]
    }

    function characterToNumber(char: string): number{
        let parsedNumber = parseInt(char, 10);
        if (!isNaN(parsedNumber)) {
            return parsedNumber
        }
        var convertedNumber: characterValues = (<any>characterValues)[char];
        return convertedNumber
    }

    function hashAppleId (id: number): string{
        if (id > 10000000000) { return "" }

        let digit1 = Math.floor(id / (62 ** 5))
        let remainder1 = (id % (62 ** 5))
        let place1 = numberToCharacter(digit1)
    
        let digit2 = Math.floor(remainder1 / (62 ** 4))
        let remainder2 = (remainder1 % (62 ** 4))
        let place2 = numberToCharacter(digit2)
    
        let digit3 = Math.floor(remainder2 / (62 ** 3))
        let remainder3 = (remainder2 % (62 ** 3))
        let place3 = numberToCharacter(digit3)
    
        let digit4 = Math.floor(remainder3 / (62 ** 2))
        let remainder4 = (remainder3 % (62 ** 2))
        let place4 = numberToCharacter(digit4)
    
        let digit5 = Math.floor(remainder4 / (62 ** 1))
        let remainder5 = (remainder4 % (62 ** 1))
        let place5 = numberToCharacter(digit5)

        let place6 = numberToCharacter(remainder5)
    
        let hashString = place1.concat(place2, place3, place4, place5, place6)
    
        return hashString   
    }
    
    function unhashAppleId (hash: string): number{
        if (hash.length != 6){ return 0 }
        let place1 = characterToNumber(hash.charAt(0))
        let place2 = characterToNumber(hash.charAt(1))
        let place3 = characterToNumber(hash.charAt(2))
        let place4 = characterToNumber(hash.charAt(3))
        let place5 = characterToNumber(hash.charAt(4))
        let place6 = characterToNumber(hash.charAt(5))

        let digit1 = (place1 * (62 ** 5))
        let digit2 = (place2 * (62 ** 4))
        let digit3 = (place3 * (62 ** 3))
        let digit4 = (place4 * (62 ** 2))
        let digit5 = (place5 * 62)
        let digit6 = (place6)

        let returnNumber = digit1 + digit2 + digit3 + digit4 + digit5 + digit6
        return returnNumber
    }

    export function createUniversalId (spotifyId: string, appleId: string) : string {
        let parsedId = parseInt(appleId, 10);
        if (isNaN(parsedId)) { return "" }
        let appleIdHashed = hashAppleId(parsedId)
        let universalId = spotifyId.concat(appleIdHashed)
        return universalId
    }

    export function decodeUniversalId (universalId: string): any {
        if (universalId.length != 28){ return "" }
        let spotifyId = universalId.substring(0, 22)
        let appleIdHashed = universalId.substring(22)
        let appleId = unhashAppleId(appleIdHashed)
        
        let returnData = {
            spotifyId: spotifyId,
            appleId: appleId
        }

        return returnData
    }

    enum characterValues {
        a = 10,
        b = 11,
        c = 12,
        d = 13,
        e = 14,
        f = 15, 
        g = 16, 
        h = 17, 
        i = 18, 
        j = 19, 
        k = 20, 
        l = 21, 
        m = 22, 
        n = 23, 
        o = 24, 
        p = 25, 
        q = 26, 
        r = 27, 
        s = 28, 
        t = 29, 
        u = 30, 
        v = 31, 
        w = 32, 
        x = 33,
        y = 34, 
        z = 35, 
        A = 36, 
        B = 37, 
        C = 38, 
        D = 39, 
        E = 40, 
        F = 41, 
        G = 42, 
        H = 43, 
        I = 44, 
        J = 45, 
        K = 46, 
        L = 47, 
        M = 48, 
        N = 49, 
        O = 50, 
        P = 51, 
        Q = 52, 
        R = 53, 
        S = 54, 
        T = 55, 
        U = 56, 
        V = 57, 
        W = 58, 
        X = 59, 
        Y = 60, 
        Z = 61, 
    }
}