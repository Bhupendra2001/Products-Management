const orderModel = require('../Model/orderModel')
const cartModel = require('../Model/cartModel')
const {isValidObjectId}= require('../validation/validation')

const createOrder = async (req,res) =>{
    try{
    const userId = req.params.userId
    const{cartId, cancellable } = req.body

    if(!cartId) return res.status(400).send({status:false,message:"cartId is required"})
    if(!isValidObjectId(cartId)) return res.status(400).send({status:false,message:"invalid cartId"})
    let checkCart = await cartModel.findById(cartId).select({__v:0,_id:0}).lean()
    if(checkCart.userId!=userId) return res.status(400).send({status:false,message:"cartId provided doesnt belongs to this user"})
    if(checkCart.totalItems==0) return res.status(400).send({status:false,message:"cart is empty add products and try again"})
    let orderObj = {...checkCart}
    orderObj.totalQuantity = checkCart.items.reduce((acc,x)=>x.quantity+acc,0)
    if(cancellable){
    orderObj.cancellable = cancellable
    }
    const toSend = await orderModel.create(orderObj)
    if(toSend){
    let cartTT = await cartModel.findOneAndUpdate({userId:userId},{
            items:[],
            totalPrice:0,
            totalItems:0
    },{new:true})
    }
    res.status(201).send({status:true,message:"Success",data:toSend})
}catch(err)
{
    return res.status(500).send({status : false , message : err.message})
}

}

const updateOrder = async (req,res)=>{
    try{
        let userId = req.params.userId
        let data = req.body
        let { status , orderId } = data
        if(!status) return res.status(400).send({status : false, message : "please provide status"})
        if(!["pending","completed","cancled"].includes(status)) return res.status(400).send({status : false, message : "please provide only pending ,cancled ,completed "})
        if(!orderId) return res.status(400).send({status : false, message : "please provide orderId"})
        if(!isValidObjectId(orderId)) return res.status(400).send({status : false, message : "please provide  valid orderId"})
        
        let orderData = await orderModel.findById(orderId)
        if(!orderData) return res.status(404).send({status : false, message : "order not found"})
        if(orderData.userId != userId) return res.status(404).send({status : false , message : "given user not exit orderdata"})
        if(orderData.cancellable == false && status == 'cancled') return res.status(400).send({status : false, message : "you can not cancle this order "})
        let updatedData = await orderModel.findByIdAndUpdate(orderId,{ $set :{status : status}},{new : true})
        return res.status(200).send({status : true, message : "Success", data : updatedData })
       
     }catch(err){
        return res.status(500).send({status : false , message : err.message})
     }
}

module.exports = { updateOrder ,createOrder }
