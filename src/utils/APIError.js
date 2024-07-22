class APIError extends Error{
    constructor(
        statuseCode,
        message = "something went wrong",
        errors = [],
       statck=""
    ) {
        super(message) 
        this.statuseCode = statuseCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        if (statck) {
          this.stack=statck
        } 
        else {
            Error.captureStackTrace(this,this.constructor)
      }  
    }
}
export {APIError}