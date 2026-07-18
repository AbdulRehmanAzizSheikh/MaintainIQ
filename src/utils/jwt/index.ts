import jsonwebtoken from "jsonwebtoken";

export const generateToken = <T extends object>(
  data: T,
  expiresInSeconds = 60 * 60,
): string => {
  const secret = process.env.JWT_SECRET as string;
  return jsonwebtoken.sign(data, secret, { expiresIn: expiresInSeconds });
};

export const decodeToken = <T extends object>(token: string): T => {
  const secret = process.env.JWT_SECRET as string;
  return jsonwebtoken.verify(token, secret) as T;
};
