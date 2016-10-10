<?php


class Uquery {
	public $raw = '';
	public $id = '';
	public $key = '';
	public $hanlde = '';
	public $timestamp = '';
	public $table = '';
	public $sub_handle = '';
	public $flag = '';
	public $class = '';
	public $type = '';
	public $s_type = '';
	

	function __construct($_raw) {
		$this->raw = $_raw;
		$def = explode(':',$_raw);
		$this->type = $def[0];
		$this->id = ' ';
		
		if (count($def) > 1){
			$this->id = $def[1];
		}
		
		$this->sub_handle = null;
		if (count($def) > 2){
			$this->sub_handle = $def[2];
		}
		$split = strrpos($this->id,'-');

		if ($split === false){
			$this->handle = $this->id;
		}
		else{
			$this->handle = substr($this->id,0,$split);
		}
		
		$this->flag = $this->id[0];
		if (in_array($this->flag,array('$','&','*','#','%'))){
			$this->handle = substr($this->handle,1);
		}
		else{
			if ($split === false){
				$this->flag = '&';
			}
		}
		if ($split !== false){
			$this->timestamp = substr($this->id,$split+1);
		}
		else{
			
			$this->timestamp = 'D'.date('Ymd').'T'.date('His') . 'Z'. rand ( 100 , 999 );
		}
		
		
		$type_parts = explode('.',$this->type);
		$this->table = $type_parts[0];
		$this->s_type = $this->type;
		if (count($type_parts) > 1){
			$this->s_type = $type_parts[1];
		}
		$this->class = '';
		switch($this->table){
			case 'object':
				$this->class = 'Object';
				break;
			
			case 'scaffold':
				$this->class = 'Scaffold';
				break;
				
			case 'user':
				$this->class = 'User';
				break;
				
			case 'file':
				$this->class = 'File';
				break;
				
			case 'subscription':
				$this->class = 'Subscription';
				break;
				
			default:
				throw new StopException ('invalid type: ' . $this->table . ' from : ' . $this->raw);
		}
		$this->key_base = $this->type . ':' . $this->handle;
		$this->key = $this->type . ':' . $this->handle . '-' . $this->timestamp;

	}
	
	public function match($k, $context = array()){
		if(is_string($k)){
			$k = new Uquery($k);
		}
		
		$retval = false;
		switch($this->flag){
			case '*';
				$retval = ($k->type == $this->type);
				break;
				
			case '#':
				$retval = ($k->key_base == $this->key_base);
				break;
				
			case '%':
				$retval = ($k->type == $this->type); //TODO use context to check user ownership
				break;
			
			case '&':
				$retval = ($k->key_base == $this->key_base);
				break;
				
			default:
				$retval = ($k->key == $this->key);
				break;
		}
		
		return $retval;
	}
	
	public function newTimestamp(){
		$this->timestamp = 'D'.date('Ymd').'T'.date('His') . 'Z'. rand ( 100 , 999 );
	}
	
	public static function set($key,$data){
		if (is_string($key)){
			$key = new Uquery($key);
		}
		if (is_object($data)){
			$data = (array)$data;
		}
		$data['key'] = $key->key;
		$data['key_base'] = $key->key_base;
		
		$class = $key->class;
		
		$action = 'create';
		if (Uquery::exists($key)){
			$action = 'update';
		}
		if (isset($data['status']) && $data['status'] == 'deleted'){
			$action = 'deleted';
		}
		if (isset($data['status']) && $data['status'] == 'destroy'){
			$action = 'destroy';
		}
		
		$retval = $class::set($key,$data);
		
		NotificationHandler::fire($key, $action, $retval->toArray());
		
		return $retval;
	}
	
	public static function get($key){
		if (is_string($key)){
		$key = new Uquery($key);
		}
		$query = null;
		
		$class= $key->class;
		
		$query = $class::where('id','>',-1);

		$company = User::currentCompany();
		if ($company != null && isset($company->guid)){
			$query->where('company','=',$company->guid);
		}
		
		
		switch($key->flag){
			case '#':
				
				break;
			case '&':
				$query->where('key_base','=',$key->key_base)->orderBy('key','desc');
				break;
			default:
				$query->where('key','=',$key->key);
				break;
		}
		
		if ($query != null){
			return $query->get();
		}
		
		throw new StopException("get doesn't make sense! : " . json_encode($key));
	}
	
	public static function exists($key){
		if(is_string($key)){
			$key = new Uquery($k);
		}
		
		$class = $key->class;
		
		$count = $class::where('key_base','=',$key->key_base)->count();
		
		return $count > 0;
	}
	
	public static function getAllKeys($class = null){
		$retval = array();
		if ($class == null){
			$classes = array('Object','Scaffold','User');
			foreach($classes as $class){
				$retval = array_merge($retval,static::getAllKeys($class));
			}
		}
		else{
			$query = $class::where('id','>',-1);
			$company = User::currentCompany();
            if ($company != null && isset($company->guid)){
                $query->where('company','=',$company->guid);
            }
			
			$docs = $query->orderBy('key','desc')->get();
			
			$bases = array();
			
			foreach($docs as $doc){
				$retval[] = $doc->key;
			}
		}
		
		return $retval;
	}
	public static function getKeys($class = null){
		$retval = array();
		if ($class == null){
			$classes = array('Object','Scaffold','User');
			foreach($classes as $class){
				$retval = array_merge($retval,static::getKeys($class));
			}
		}
		else{
			$query = $class::where('id','>',-1);
			$user = Session::get('currentUser',null);
			if ($user != null){
				$query->where('company','=',$user->company);
			}
			$docs = $query->orderBy('key','desc')->get();
			
			$bases = array();
			
			foreach($docs as $doc){
				if (!in_array($doc->key_base,$bases)){
					$retval[$doc->key_base] = $doc->key;
					$bases[] = $doc->key_base;
				}
			}
		}
		
		return $retval;
	}


	public static function makeHandle($title, $randomLength = 10){
		$title = preg_replace("/[^a-zA-Z0-9]+/", "", $title);
        $title = substr($title,0,15);
        $title = strtolower($title);
		
		return $title . '!' . static::generateRandomString($randomLength);
	}


	public static function generateRandomString($length = 10) {
	    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	    $charactersLength = strlen($characters);
	    $randomString = '';
	    for ($i = 0; $i < $length; $i++) {
	        $randomString .= $characters[rand(0, $charactersLength - 1)];
	    }
	    return $randomString;
	}

    public static function getPrefill($name, $data = array()){
        $prefill_folder = app_path() . DIRECTORY_SEPARATOR . 'prefill_data'. DIRECTORY_SEPARATOR . $name . '.json';
        $json = file_get_contents($prefill_folder);

        $json = static::substArray($json, $data);

        return json_decode($json,true);
    }

    public static function substArray($str, $array, $levels = array()){
        $level_prefix = "";
        $level_suffix = "";

        foreach($levels as $level){
            $level_prefix .= $level.'[';
            $level_suffix .= ']';
        }

        foreach($array as $key=>$value){
            $key = $level_prefix . $key . $level_suffix;
            if (is_array($value)){
                $temp_levels = $levels;
                $temp_levels[] = $key;
                $str = static::substArray($str, $value, $temp_levels);
                $value = json_encode($value);
            }
            
            $str = str_replace("<$key>",$value,$str);
        }
        return $str;
    }

}
