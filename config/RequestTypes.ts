type RequestReceipt = {
    image: string;
    shopName: string;
    itemId: string;
    itemName: string;
    buyDate?: number;
    totalPrice: number;
    warrantyPeriod: number, // in seconds
    userID: string;
};
