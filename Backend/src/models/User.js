import mongoose from "mongoose";

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:[true,"Name is Required"],
            trim:true
        },
        email:{
            type:String,
            required:[true,"Email is Required"],
            unique:true,
            lowercase:true,
            trim:true,
           
        },


       
        password:{
            type:String,
            required:true,
            minlength:6
        },
        role:{
            type:String,
            enum:["resident","collector","admin"],
            default:"resident"
        },


        isApproved:{
            type:Boolean,
            default:false
        },

        isAvailable:{
            type:Boolean,
            default:false
        },
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },

        location:{
            type:{
                type:String,
                enum:["Point"],
                default:"Point"

            },
             coordinates:{
            type:[Number],
            default:[0,0]
        },
        },
       },
       {
        timestamps:true,
       }

);

userSchema.index({location:'2dsphere'});

const User=mongoose.model("User",userSchema);

export default User;