export function sanitizeStringBasic (string: string): string {
    var processedString = string
    processedString = processedString.replace(/[-:&!?()]/g, '')
    processedString = processedString.replace(/\s+/g,' ').trim()
    processedString = processedString.toLowerCase()

    return processedString
}

export function sanitizeStringComplex (string: string): string {
    var processedString = string
    if (processedString.replace(/(\(.*?\))/i, '').trim() != ''){
        processedString = processedString.replace(/(\(.*?\))/i, '').trim()
    }
    processedString = processedString.replace(/(\[.*mix.*\])/i, '')
    processedString = processedString.replace(/(\(.*mix.*\))/i, '')
    processedString = processedString.replace(/(-.*mix)/i, '')
    processedString = processedString.replace(/(\[.*edit.*\])/i, '')
    processedString = processedString.replace(/(\(.*edit.*\))/i, '')
    processedString = processedString.replace(/(-.*edit)/i, '')
    processedString = processedString.replace(/(\[feat.*\])/i, '')
    processedString = processedString.replace(/(\(feat.*\))/i, '')
    processedString = processedString.replace(/(\[ft.*\])/i, '')
    processedString = processedString.replace(/(\(ft.*\))/i, '')
    processedString = processedString.replace(/(- single)/i, '')
    processedString = processedString.replace(/(- ep)/i, '')
    processedString = processedString.replace(/( ep\Z)/i, '')
    processedString = processedString.replace(/( ep[^a-z])/i, '')
    processedString = processedString.replace(/[-:&!?()]/g, '')
    processedString = processedString.replace(/remastered\ (\d+)/i, '')
    processedString = processedString.replace(/remaster\ (\d+)/i, '')
    processedString = processedString.replace(/(?<=remastered) version/i, '')
    processedString = processedString.replace(/(\d+) remastered/i, '')
    processedString = processedString.replace(/(\d+) remaster/i, '')
    processedString = processedString.replace(/(\d+) mix/i, '')
    processedString = processedString.replace(/\s+/g,' ').trim()
    processedString = processedString.toLowerCase()

    return processedString
}

export function compareStrings (string1: string, string2: string): number{
    let array1 = string1.toLowerCase().split(/[^A-Za-z0-9]/).filter(function (element:string) {return element != '';});;
    let array2 = string2.toLowerCase().split(/[^A-Za-z0-9]/).filter(function (element:string) {return element != '';});;

    if (array1.length >= array2.length){
        let totalWords = array1.length
        var matchedWords = 0
        for (let word of array1){
            if (array2.includes(word)){
                matchedWords += 1
            }
        }
        let matchPercentage = matchedWords/totalWords
        return matchPercentage
    }
    else {
        let totalWords = array2.length
        var matchedWords = 0
        for (let word of array2){
            if (array1.includes(word)){
                matchedWords += 1
            }
        }
        let matchPercentage = matchedWords/totalWords
        return matchPercentage
    }
}

export function msToStandard(ms:string):string {
    let totalSeconds = parseInt(ms)/1000
    let minutes = Math.floor(totalSeconds/60)
    var seconds = `${Math.floor(totalSeconds%60)}`
    if (seconds.length == 0) {
        seconds = '00'
    } else if (seconds.length == 1){
        seconds = '0' + seconds
    }
    let standardTime = `${minutes}:${seconds}`
    return standardTime
}