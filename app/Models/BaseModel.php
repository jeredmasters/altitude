<?php

class BaseModel extends \Eloquent {
    
    protected $json = array();
    protected $encrypted = array();

    public function getAttribute($key)
    {
        $val = parent::getAttribute($key);
        if (in_array($key, $this->encrypted))
        {
            $val = Crypt::decrypt($val);
        }
        if (in_array($key, $this->json))
        {
            $val = json_decode($val, true);
        }

        return $val;
    }

    public function setAttribute($key, $value)
    {
        if (in_array($key, $this->json))
        {
            $value = json_encode($value);
        }
        if (in_array($key, $this->encrypted))
        {
            $value = Crypt::encrypt($value);
        }
        parent::setAttribute($key, $value);
    }
    
    public function toArray(){
        $array = parent::toArray();
        foreach($array as $key => $value){
            try{
                if (in_array($key,$this->encrypted) && $array[$key] != null){
                    $array[$key] = Crypt::decrypt($array[$key]);
                }
                if (in_array($key,$this->json)){
                    $array[$key] = json_decode($array[$key],true);
                }
            }
            catch(Exception $ex) 
            {
                throw new StopException($ex->getMessage() . ': [' . $key . '] => ' . $value,0,$ex);
            }
            catch(\Exception $ex) 
            {
                throw new StopException($ex->getMessage() . ': [' . $key . '] => ' . $value,0,$ex);
            }
        }        
        return $array;
    }
    
    public static function resolve($item){
        if (is_string($item) || is_integer($item)){
            $item = Company::find($item);
        }
        return $item;
    }

 
}
