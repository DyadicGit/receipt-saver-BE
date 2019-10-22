interface Receipt {
    id: string,
    image: string,
    shopName: string,
    itemId: string,
    itemName: string,
    buyDate: number,
    creationDate: number,
    totalPrice: number,
    warrantyPeriod: number, // in seconds
    userID: string
}

interface Item {
    id: string,
    receiptID: string,
    name: string,
    attachment: string
}

interface User {
    id: string,
    email: string,
    social: string,
    receiptId: string
}
