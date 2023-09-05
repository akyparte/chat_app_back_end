require('dotenv').config();
const express = require('express');
const app = express();
const users = {};
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,{
    cors:{
        origin:'*'
    }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('send-name', (data) => {
    if(users[data]){
      socket.emit('send-name',false);
    }else {
        users[data]= socket;
        socket.user = data;
        socket.emit('send-name',true);
    }
  });

  socket.conn.on('close',() => {
     if(socket.user){
       if(users[socket.friend]){
         users[socket.friend].emit('friend-gone')
         delete users[socket.friend]
       }
       delete users[socket.user]
     }
  })

  // user sending request to friend
  socket.on('invite-friend', (data) => {
      if(users[data.friendName]){
        users[data.friendName].emit('invite-friend',{ data : { friendName : data.userName } , status:'accept-request'})
      }else {
        socket.emit('friend-offline');
      }
  })


  socket.on('send-message',(data) => {
      if(users[data.friendName]){
        users[data.friendName].emit('receive-message',data.message)
      }
  })

  socket.on('request-reject',(friendName) => {
     if(users[friendName]){
      users[friendName].emit('invite-friend',{status:'request-reject',data:{friendName}})
     }
  })
  socket.on('accept-request', (data) => {
      if(users[data.friendName]){
        users[data.friendName].emit('invite-friend',{status : "approve-accept"})
        users[data.friendName].friend = data.userName;
        users[data.userName].friend = data.friendName;
      }
  })

  socket.on('typing', (friendName) => {
    if(users[friendName]){
      users[friendName].emit('typing')
    }
})

  socket.on('exit-session', (userName) => {
      delete users[userName];
  })
});



server.listen(process.env.PORT, () => {
  console.log('listening on *:5000');
});