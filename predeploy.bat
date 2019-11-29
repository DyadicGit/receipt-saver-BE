;= @echo off
;= rem install sharp distro needed for aws lambda
echo "installing sharp for linux"
rm -rf node_modules/sharp
npm install --arch=x64 --platform=linux --target=10.15.0 sharp
