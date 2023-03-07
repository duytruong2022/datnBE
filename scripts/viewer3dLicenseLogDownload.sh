ssh -p "$1" -i "$2" "$3"@"$4" << EOF
   cd /D ${11}
   sh ./server-log/uploadLicenseLog.sh "$5" "$6" "$7" "$8" "$9" "${10}"
EOF