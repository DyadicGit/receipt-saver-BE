export interface Receipt extends RequestReceipt{
    id: string;
    creationDate: number;
}
export interface RequestReceipt {
    image: string;
    shopName: string;
    itemId: string;
    itemName: string;
    buyDate?: number;
    totalPrice: number;
    warrantyPeriod: number, // in seconds
    userID: string;
};

export interface Item {
    id: string,
    receiptID: string,
    name: string,
    attachment: string
}

export interface User {
    id: string,
    email: string,
    social: string,
    receiptId: string
}

export const setDefaults = (receipt: Receipt): Receipt => ({
    id: receipt.id,
    image: receipt.image || null,
    shopName: receipt.shopName || null,
    itemId: receipt.itemId || null,
    itemName: receipt.itemName || null,
    buyDate: receipt.buyDate || new Date().getTime(),
    creationDate: receipt.creationDate || new Date().getTime(),
    totalPrice: receipt.totalPrice || null,
    warrantyPeriod: receipt.warrantyPeriod || null,
    userID: receipt.userID || null
});
