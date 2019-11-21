## Receipt saving application

#### Development setup
**Setup**
* `npm install`
* `serverless dynamodb install` (run it for the first or every time when you delete the ".dynamodb" folder)
* `sls plugin install --name serverless-s3-local` (notice it's directory should be manually created in my case "offline/s3")
* `serverless offline start`
* `serverless dynamodb --migrate` (this imports schema)

**Run service offline for specific environment**

`serverless offline start --env development`

#### Environment setup: 
create environment dotenv files, as showed below:

 **".env.development"**
```
CLIENT_URL=http://localhost:3000
NODE_ENV=development
STAGE=dev
ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXX
SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXX
```
**".env.production"**
```
CLIENT_URL=https://master.YourDeployedFrontEndURL.amplifyapp.com
NODE_ENV=production
STAGE=prod
ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXX
SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXX
```
#### Database tables: 
![](./info/db-tables.png)

#### Debugging:
1) to debug using NiM (Node.js V8 --inspector Manager (NiM)) extension:
set env variable with your serverless.js location:
* `setx slsloc "C:\Users\YourUserName\AppData\Roaming\nvm\v10.16.3\node_modules\serverless\bin\serverless"`
* `node --inspect %slsloc% offline start`
2) on IntellijIdea look at screenshots in `./info` folder, dont't forget to press **Debug** (not Run)
