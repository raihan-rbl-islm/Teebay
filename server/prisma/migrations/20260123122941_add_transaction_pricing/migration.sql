-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "transactionPrice" DOUBLE PRECISION,
ADD COLUMN     "transactionRentPrice" DOUBLE PRECISION,
ADD COLUMN     "transactionRentType" "RentType";
