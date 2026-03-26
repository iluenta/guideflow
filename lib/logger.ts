const isProd = process.env.NODE_ENV === 'production'

export const logger = {
    debug: (...args: any[]) => {
        if (!isProd) {
            console.log(...args)
        }
    },
    warn: (...args: any[]) => {
        console.warn(...args)
    },
    error: (...args: any[]) => {
        console.error(...args)
    },
}
