const userModel = require('../Model/userModel')
const productModel = require('../Model/productModel')
const cartModel = require('../Model/cartModel')
const{isValidObjectId, isValidRequestBody} = require("../validation/validation")



const createCart = async function(req,res){
       try{
        const userId = req.params.userId
        const cartData = req.body;
        
        
        if(!isValidRequestBody(cartData)){return res.status(400).send({status:false, message:`provide cart details`})}

        const {productId, cartId, } = cartData
       
        if(!productId) return res.status(400).send({status:false,message:`product id is mandatory`})
        if(!isValidObjectId(productId)){return res.status(400).send({status:false,message:`invalid productId`})}
        const checkProduct = await productModel.findOne({_id: productId, isDeleted:false})
        if(!checkProduct){return res.status(404).send({status:false,message:`product not found`})}

        if(cartId){
        if(!isValidObjectId(cartId)) {return res.status(400).send({status:false,message:`invalid cartId`})}
        let checkCart = await cartModel.findById(cartId)
        if(!checkCart) return res.status(400).send({status:false,message:`cartId of cart you have provided doesnot exist`})
        if(checkCart.userId!=userId) return res.status(400).send({status:false,message:`this doesnt belongs to this user`})
        }
        
        let carT = await cartModel.findOne({userId:userId}).lean()
       
        
        if(!carT){
        cartData.items = []
        cartData.userId = userId
        cartData.items.push({productId:productId,quantity:1})
        cartData.totalPrice = checkProduct.price
        cartData.totalItems = 1
        const toSend = await cartModel.create(cartData)
        console.log(toSend)
        return res.status(201).send({status:true,message:"Success",data:toSend})
        }
        
        const found = carT.items.find(x=>x.productId==productId)
       
        if(found!=undefined){
         carT.items[carT.items.indexOf(found)].quantity = carT.items[carT.items.indexOf(found)].quantity+1
        }else{
        carT.items.push({productId:productId,quantity:1})
        }
        carT.totalItems = carT.items.length
        carT.totalPrice = carT.totalPrice + checkProduct.price

         const toSend = await cartModel.findByIdAndUpdate(carT._id,
        {
           items:carT.items,
           totalItems:carT.totalItems,
           totalPrice:carT.totalPrice
        },
        {new:true})
        return res.status(200).send({status:true,message:"Success",data:toSend})
        }catch(error){
        return res.status(500).send({status:false, messsage:error.messsage})
}
}

const getcart = async (req,res)=>
{
      try{
      let userId = req.params.userId 
      if(!userId) return res.status(400).send({status : false , message : "please provide userId"})
      if(!isValidObjectId(userId)) return res.status(400).send({status : false , message : " inValid userId"})
      let checkUser = await userModel.findOne({_id : userId })
      if(!checkUser) return res.status(404).send({status : false , message : "Given  userId not exits our user data "})
      let found_Cart = await cartModel.findOne({userId : userId})
      if(!found_Cart) return res.status(404).send({status : false , message : "Given  userId not exits our cart data"})
      return res.status(200).send({status : false, data : found_Cart })
      }catch(err){
      return res.status(500).send({ status : false, message : err.message })
      }
}

const  updateCart = async (req,res)=>
{
        try{
        let data = req.body

        if(!isValidRequestBody(data)) return res.status(400).send({status:false,message:"plese provide data"})

        const { cartId, productId, removeProduct } = data

        if(!cartId) return res.status(400).send({status:false,message:"plese provide cartId"})

        if(!productId) return res.status(400).send({status:false,message:"plese provide productId"})

        let product = await productModel.findOne({_id:productId, isDeleted:false})

        if(!product) return res.status(404).send({status:false,message:"unable to find product"})

        if(removeProduct!=1 && removeProduct!=0) return res.status(400).send({status:false,message:"do you want to delete product(use removeProduct:0) or if you want to reduce quantity(use removeProduct:1"})

        let carT = await cartModel.findById(cartId).lean()

        if(!carT) return res.status(404).send({status:false,message:"unable to find cart"})

        const found = carT.items.find(x=>x.productId==productId)

        if(!found) return res.status(404).send({status:false,message:"unable to find product in cart"})

        if(removeProduct =="0"){

        carT.totalPrice = carT.totalPrice-(product.price*carT.items[carT.items.indexOf(found)].quantity) 
        carT.items.splice(carT.items.indexOf(found),1)
        
        carT.totalItems = carT.totalItems -1
        }
        if(removeProduct=="1"){
        
        carT.items[carT.items.indexOf(found)].quantity = carT.items[carT.items.indexOf(found)].quantity-1
        
        if(carT.items[carT.items.indexOf(found)].quantity==0){
        carT.items.splice(carT.items.indexOf(found),1)
        carT.totalItems=carT.totalItems-1
        }
        carT.totalPrice = carT.totalPrice-product.price
        }
    
        const toSend = await cartModel.findByIdAndUpdate(cartId,{
        items:carT.items,
        totalItems:carT.totalItems,
        totalPrice:carT.totalPrice,
    
        },{new:true})
        return  res.status(200).send({status:true,message:"Success",data:toSend})
        }catch(err){
        return res.status(500).send({status:false,message:err.message})
}
}


const deleteCart = async (req, res) => 
{
        try {
        let userId = req.params.userId
        const cart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0}, { new: true });
        if(!cart) return res.status(404).send({ status: false, message: "Given userId not exits in cartData " })
        return res.status(204).send({ status: true, message: 'Success'});
        }
        catch (error) {
        res.status(500).send({ status: false, message: error.message })
}
}


module.exports = {createCart,getcart,updateCart, deleteCart}