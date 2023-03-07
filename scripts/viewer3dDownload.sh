ssh -p ${10} -i $7 $8@${9} << EOF
   cd /D ${11}
   sh ./repository/downloadFile.sh "$1" "$2" "$3" "$4" "$5" "$6" ${12}
EOF