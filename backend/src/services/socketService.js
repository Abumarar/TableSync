let io = null;

const init = (socketIoInstance) => {
    io = socketIoInstance;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitToStaff = (event, data) => {
    if (io) {
        io.to('staff').emit(event, data);
    }
};

const emitToKitchen = (event, data) => {
    if (io) {
        io.to('kitchen').emit(event, data);
    }
};

const emitToTable = (tableId, event, data) => {
    if (io) {
        io.to(`table_${tableId}`).emit(event, data);
    }
};

module.exports = {
    init,
    getIo,
    emitToStaff,
    emitToKitchen,
    emitToTable
};
