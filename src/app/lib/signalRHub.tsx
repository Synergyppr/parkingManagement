// import * as signalR from "@microsoft/signalr";

// export const createHubConnection = (): signalR.HubConnection => {
//   const url = `http://104.46.113.1/notificationHub`;

//   const connection = new signalR.HubConnectionBuilder()
//     .withUrl(url, {
//       transport: signalR.HttpTransportType.WebSockets,
//     })
//     .withAutomaticReconnect([0, 2000, 10000, 30000])
//     .configureLogging(signalR.LogLevel.Debug)
//     .build();

//   return connection;
// };

// createHubConnection.keepAliveIntervalInMilliseconds = 15000; // 15 seconds
// createHubConnection.serverTimeoutInMilliseconds = 30000; // 30 seconds
