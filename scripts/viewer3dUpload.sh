ssh -p "$1" -i "$2" "$3"@"$4" << EOF
   cd /D ${8}
   sh ./repository/createFolder.sh "$7"
EOF
scp -P "$1" -i "$2" $5 $3@$4:"$6"

