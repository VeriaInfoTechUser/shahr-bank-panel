export const orderStatusList =[
    { value: "pending", label: "Pending" },
    { value: "re-register", label: "Re-register" },
    { value: "preparing_initial_offer", label: "Preparing the initial offer to the client" },
    { value: "final_issuance_proforma_invoice", label: "Final issuance of proforma invoice" },
    { value: "awaiting_payment", label: "Awaiting payment from the buyer" },
    { value: "under_review_approval", label: "Under review and approval by the bank" },
    { value: "final_purchase_process", label: "In the final purchase process" },
    { value: "finalizing_purchase_delivery", label: "Finalizing the purchase and delivery to shipping company" },
    { value: "product_on_the_way", label: "The desired product is on the way" },
    { value: "product_delivered", label: "The desired product has been delivered to the buyer" },
    { value: "end_of_order", label: "End of order" }
]

export const statusList =[
    { value: 1, label: "Active" },
    { value: 0, label: "Inactive" }
]

export const orderRequest ={
    id:null,
    slug:null,
    follow_up_date:"",
    title:null,
    time_create_view:null,
    time_update_view:null,
    is_new_customer:null,
    send_from:'admin',
    customer:{
        id:null,
        email:null,
        first_name:null,
        last_name:null,
        name:null,
        avatar:null
    },
    order:{
        product:{
            title:null,
            company:null,
            quantity:null,
            quantity_unit:null,
            description:null,
        },
        delivery:{
            country:null,
            state:null,
            city:null,
            zip_code:null,
            address:null,
            location:{
                lat:null,
                long:null,
            },
        },
        attachments:[],
        status:null
    }
}