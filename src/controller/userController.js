const userModel = require("../Model/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const{ uploadFile } = require("../aws/aws")

const{isValid,
    isValidEmail,
    isValidPassword,
    isValidName,
    isValidPhone,
    isValidPincode,
    isValidstreet,
    isValidRequestBody,
    isValidObjectId,
    isValidImg,
    isValidTitle,
    } =require("../validation/validation")

const registerUser = async (req, res) => {
        try {
        let data = req.body
        let image = req.files
     
        if (Object.keys(data).length == 0)
        return res.status(400).send({ status: false, message: "please give some data" });       
        let { fname, lname, email, phone, password, address, } = data
        if (!fname) return res.status(400).send({status:false,message:"please provide fname"})
        if (!isValidName(fname)) return res.status(400).send({status:false,message:"please provide valid fname"})
        if (!lname) return res.status(400).send({status:false,message:"please provide lname"})
        if (!isValidName(lname)) return res.status(400).send({status:false,message:"please provide valid lname"})
        if (!email) return res.status(400).send({status:false,message:"please provide email"})
        if (!isValidEmail(email)) return res.status(400).send({status:false,message:"please provide valid email"})
        const UnEmail = await userModel.findOne({email:email})
        if(UnEmail) return res.status(400).send({status:false,message:"email already exists"})
        if (!phone) return res.status(400).send({status:false,message:"please provide Phone number"})
        if (!isValidPhone(phone)) return res.status(400).send({status:false,message:"please provide valid PhoneNumber"})
        const UnPhone = await userModel.findOne({phone:phone})
        if(UnPhone) return res.status(400).send({status:false,message:"Number already exists"})
        if (!password) return res.status(400).send({status:false,message:"please provide password"})
        if (!isValidPassword(password)) return res.status(400).send({status:false,message:"Password should be 8 to 15 and add atleast one capital alphabet & atleast one special char"})
        if(!address) return res.status(400).send({status:false,message:"please provide address"})
        address = JSON.parse(address)
        let { shipping , billing} = address
        if(shipping){
        let { street , city , pincode} = shipping
        if(!street) return res.status(400).send({status:false,message:"please provide shipping-street"})
        if(!isValidTitle(street)) return res.status(400).send({status:false,message:"please provide valid shipping-street"})
        if(!city) return res.status(400).send({status:false,message:"please provide shipping-city"})
        if(!isValidTitle(city)) return res.status(400).send({status:false,message:"please provide valid shipping-city"})
        if(!pincode) return res.status(400).send({status:false,message:"please provide shipping-pincode"})
        if(!isValidPincode(parseInt(pincode))) return res.status(400).send({status:false,message:"please provide valid shipping-pincode"})
        }

        if(billing){
        let { street , city , pincode} = billing
        if(!street) return res.status(400).send({status:false,message:"please provide billing-street"})
        if(!isValidTitle(street)) return res.status(400).send({status:false,message:"please provide valid billing-street"})
        if(!city) return res.status(400).send({status:false,message:"please provide billing-city"})
        if(!isValidTitle(city)) return res.status(400).send({status:false,message:"please provide valid billing-city"})
        if(!pincode) return res.status(400).send({status:false,message:"please provide billing-pincode"})
        if(!isValidPincode(parseInt(pincode))) return res.status(400).send({status:false,message:"please provide valid billing-pincode"})
        }
       
       data.address = address
       
        
       

        if (!image[0]) { return res.status(400).send({status:false,message:"please provide image"})}
        if (!isValidImg(image[0].originalname)){ return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG",  }) }

        let url = await uploadFile(image[0]);
        data["profileImage"] = url;

        let salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);


        const user = await userModel.create(data);
        return res.status(201).send({
          status: true,
          message: "user is successfully created",
          data: user,
        })
        }
        catch(err){
        return res.status(500).send({ status: false, message:err.message})
        }
    
}

const login = async (req, res)=>{
        try{
        const email = req.body.email
        const password = req.body.password
    
        if(!email) return res.status(400).send({status : false , message : "email id is required"})
        if(!password) return res.status(400).send({status : false , message : "password  is required"})
        if(!isValidEmail(email))  return res.status(400).send({status : false , message : "email id is required"})
            
        if(!isValidPassword(password)) return res.status(400).send({status : false , message : "password  is required"})
        let getUser = await userModel.findOne({email:email})
        if(!getUser) return res.status(404).send({status : false , message : "User Not Found"})
            
        const checkPassword = await bcrypt.compare( password, getUser.password)
        if(!checkPassword)  return res.status(401).send({ status: false, msg: "Password is incorrect" })
        let payload = 
        {
              userId: getUser._id.toString(),
              emailId: getUser.email,
              Batch: "lithium",
              Group: "1",
              Project: "project-5-Products-Management-Group-1",
        }

        const  token = jwt.sign(payload,"key-group-1" ,  {expiresIn: "60m"} )
          
        return res.status(200).send({ status: true, message: "token is successfully generated", data:{userId: getUser._id,token:token}})
    
        }catch(err){
        return res.status(500).send({status : false, message : err.message})
        }
    }

    const getUserProfile = async function(req,res){
      try{
          const userId = req.params.userId;
           
          let user = await userModel.findOne({_id: userId})
  
          if(!user){
              return res.status(404).send({status:false, message:`User not found`})
          }
  
        return  res.status(200).send({status:true, message:"User profile details", data: user})
  
      }catch(error){
          res.status(500).send({status:false, message:error.message})
          return
      }
  }



  const updateUserProfile = async function(req,res){
    try{
        const userId = req.params.userId;

            const checkUser = await userModel.findOne({_id: userId})

            if(!checkUser){
                return res.status(404).send({status:false, message:`User Not Found`})
            }
        
        
        let {fname, lname, email, profileImage, phone, password, address} = req.body;
        let updateObj = new Object()  
        if(!isValidRequestBody(req.body)) return res.status(400).send({status:false,message:"provide body detilies"})
        if(fname){
            if(!isValid(fname)) return res.status(400).send({status:false, message:`Enter valid First Name`})
            if(!isValidName(fname)) return res.status(400).send({status:false, message:`Enter valid First Name`})
            updateObj.fname = fname
        }

        if(lname){
            if(!isValid(lname)){return res.status(400).send({status:false, message:`Enter valid Last Name`})}
            if(!isValidName(lname)) return res.status(400).send({status:false, message:`Enter valid last Name`})
            updateObj.lname = lname
        }

        if(email){
            if(!isValidEmail(email)){return res.status(400).send({status:false, message:`Enter Correct Email`})}
            const checkEmail = await userModel.findOne({email:email})
            if(checkEmail){return res.status(400).send({status:false, message:`${email} is already Regiesterd`})}
            updateObj.email = email
        }

        if(phone){
            if(!isValidPhone(phone)){return res.status(400).send({status:false, message:`${phone} is invalid mobile number`})}
            const checkPhone = await userModel.findOne({phone:phone})
            if(checkPhone){return res.status(400).send({status:false, messsage:`${phone} is already Registered`})}
            updateObj.phone = phone
        }

        if(password){
            if(!isValid(password)){return res.status(400).send({status:false, message:`enter correct password`})}
            if(!isValidPassword(password)){return res.status(400).send({status:false, message:`Password should be between 8to15`})}
            let hash = bcrypt.hashSync(password, 10)
             updateObj.password = hash 
        }
        if(profileImage){
            return res.status(400).send({status:false, message:`provide validimage`})
        }

         const file = req.files
         if(file[0])
         if(!isValidImg(file[0].originalname)) return res.status(400).send({status:false, message:`provide validimage`})

         if(file.length>0){
            
        let profilepic = await uploadFile(file[0])
        updateObj.profileImage = profilepic
        }
       
        if(address){
            const {shipping, billing} = address
            if(shipping){
                if(shipping.street)
                if(!isValid(shipping.street)){return res.status(400).send({status:false, message:`enter valid shipping street`})};
                if(shipping.pincode)
                if(!isValidPincode(shipping.pincode)){return res.status(400).send({status:false, message:`enter valid shipping pin`})}
                if(shipping.city)
                if(!isValid(shipping.city)){return res.status(400).send({status:false, message:`enter valid shippingcity name`})}
            }
            if(billing){
                if(billing.street)
                if(!isValid(billing.street)){return res.status(400).send({status:false, message:`enter valid billing street`})};
                if(billing.pincode)
                if(!isValidPincode(billing.pincode)){return res.status(400).send({status:false, message:`enter valid billing pin`})}
                if(billing.city)
                if(!isValid(billing.city)){return res.status(400).send({status:false, message:`enter valid billing city name`})}
            }
            updateObj.address = address
        }


        const updateProfile = await userModel.findOneAndUpdate({_id:userId},{$set: updateObj},{new:true})

        res.status(200).send({status:true, message:`Successfull Updated`, data: updateProfile})
        return

    }catch(error){
        return res.status(500).send({status:false, message:error.message})
    }
};
  
module.exports={registerUser, login, getUserProfile, updateUserProfile }
