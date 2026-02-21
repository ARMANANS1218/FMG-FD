import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import renderTime from "../../utils/renderTime";

// import ChatReply from "../../components/common/public/ChatReply";

const ChatMessage = ({ msg, selectedUser }) => {
    // console.log("msg", msg?.from);
    const isFrom = msg?.from === selectedUser?._id;
    // isFrom means "from the other user" (incoming message)
    
    return (
      <Box mb={1.5} display="flex" justifyContent={isFrom ? "flex-start" : "flex-end"}>
        <Stack direction="row" sx={{ flexDirection: isFrom ? "row" : "row-reverse" }}>
          <Box
              className={`p-2 px-3 rounded-lg max-w-[300px] shadow-sm ${
                isFrom 
                  ? "bg-muted text-foreground rounded-tl-none" 
                  : "bg-primary text-primary-foreground rounded-tr-none"
              }`}
            >
            <Stack direction={'column'} spacing={0.5}>
              <Typography variant="body1" sx={{ wordWrap: 'break-word' }}>{msg?.message}</Typography>
              {msg?.message?.replies?.message && (
                 <Typography variant="body2" className="opacity-80 italic border-l-2 pl-2 border-current">
                    {msg?.message?.replies?.message}
                 </Typography>
              )}
            </Stack>
            <Typography variant="caption" className="text-[10px] opacity-70 block text-right mt-1">
              {renderTime(msg?.createdAt)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  };

  export default ChatMessage;