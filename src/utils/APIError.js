class APIError extends Error{
    constructor(
        statuseCode,
        message = "something went wrong",
        errors = [],
       stack=""
    ) {
        super(message) 
        this.statuseCode = statuseCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        if (stack) {
          this.stack=stack
        } 
        else {
            Error.captureStackTrace(this,this.constructor)
      }  
    }
}
export {APIError}