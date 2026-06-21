import jwt from "jsonwebtoken";


export const protect=(req,res,next)=>{
    const authHeader=req.headers.authorization;

    if(!authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message:"Not Authorised"
        })

        try{
            const token=authHeader.split(" ")[1];

            const decoded=jwt.verify(token,process.env.JWT_ACCESS_SECRET);

            req.user=decoded;

            next();
        }
        catch(error){
            return res.status(401).json({
                message:"Invalid token"
            })
        }




        
    }
}



export const 