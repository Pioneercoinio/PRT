#! /bin/bash

INIT=false

if [ ! -d "venv" ]; then
  virtualenv -p python3 venv
  INIT=true
fi

source ~/.profile
source venv/bin/activate

if $INIT; then
    pip install -r requirements.txt
fi

/bin/bash
