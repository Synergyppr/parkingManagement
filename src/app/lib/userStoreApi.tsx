import {
  UpdateUserInterface,
  CredentialsInterface,
  SessionUserInterface,
} from "./interfaces";

// Auth Get Profile ///////////////////////////////////////////////////////////
export const getUserProfile = async (
  id: string
): Promise<UpdateUserInterface> => {
  if (id && id !== undefined) {
    //   try {
    //     const body = {
    //       id: id,
    //     };
    //     const res = await fetch(getUserProfileEndpoint, {
    //       method: "POST",
    //       body: JSON.stringify(body),
    //       headers: headers,
    //       cache: "no-store",
    //     });
    //     const data = (await res.json()) as UpdateUserInterface;
    //     return Promise.resolve(data);
    //   } catch (err) {
    //     if (err instanceof Error) {
    //       console.log(err.name);
    //       console.log(err.message);
    //       console.log(err.stack);
    //     }
    //   }
  }
  return Promise.resolve({} as UpdateUserInterface);
};

// Auth Validate User //////////////////////////////////////////////////////
export const validateUser = async (
  credentials: CredentialsInterface
): Promise<SessionUserInterface | null | undefined> => {
  //   let userIdJson;

  // const sendForm = {
  //   userName: credentials?.username,
  //   identifier: credentials?.password,
  //   propertyId: credentials?.propertyId,
  // };

  if (credentials) {
    //   try {
    //     const res = await fetch(userStoreAuthenticateEndpoint, {
    //       method: "POST",
    //       body: JSON.stringify(sendForm),
    //       headers: headers,
    //       cache: "no-store",
    //     });
    //     userIdJson = await res.json();
    //     let retUser: SessionUserInterface = {
    //       id: userIdJson?.data?.accesToken,
    //       name: credentials?.username,
    //       email: credentials?.username,
    //       accountStatus: userIdJson?.message,
    //       propertyId: userIdJson?.data?.propertyId,
    //     };
    //     //else if (userIdJson.data.propertyId !== credentials?.propertyId) {
    //     //   return Promise.resolve(undefined);
    //     // }
    //     if (userIdJson.message == "Account is not active") {
    //       return Promise.resolve(undefined);
    //     } else if (userIdJson.data.accesToken == "Invalid password") {
    //       return Promise.resolve(null);
    //     } else if (res.ok && retUser) {
    //       return Promise.resolve(retUser);
    //     }
    //   } catch (err) {
    //     if (err instanceof Error) {
    //       console.log("Error:", err.name, err.message, err.stack);
    //     }
    //   }

    return Promise.resolve(undefined);
  }
};
