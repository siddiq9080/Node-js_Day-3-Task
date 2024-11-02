// const cloudUrl = `mongodb+srv://siddiq:siddiq786@cluster0.uf56v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// const localDBURL = `mongodb://${host}/${dbName}`;

// const cloudUrl = `mongodb+srv://siddiq:siddiq786@cluster0.uf56v.mongodb.net/Nodejs_Task?retryWrites=true&w=majority`;

const cloudUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
