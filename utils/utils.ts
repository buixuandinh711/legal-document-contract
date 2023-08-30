import { Result } from "ethers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toEthersResult = (obj: any) => {
  return Result.from(Object.values(obj));
};
