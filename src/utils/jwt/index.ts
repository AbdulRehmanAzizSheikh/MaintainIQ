import jsonwebtoken from "jsonwebtoken";

export const generateToken = <T extends object>(
  data: T,
  expiresInSeconds?: number,
): string => {
  const secret = process.env.JWT_SECRET as string;

  if (expiresInSeconds) {
    return jsonwebtoken.sign(data, secret, { expiresIn: expiresInSeconds });
  }
  return jsonwebtoken.sign(data, secret);
};

export const decodeToken = <T extends object>(token: string): T => {
  const secret = process.env.JWT_SECRET as string;
  return jsonwebtoken.verify(token, secret) as T;
};
