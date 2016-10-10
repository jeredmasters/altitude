<?php


class Object extends BaseModel {
    
    protected $table = 'objects';
    protected $json = array('data');
    protected $hidden = array('id');
    
    public static function set ($key,$data){
        if (is_string($key)){
			$key = new Uquery($key);
		}
		$val = new Object;
		
		$val->key = $data['key'];
		$val->key_base = $data['key_base'];
		$val->company = User::currentCompany()->guid;
		$val->created_by = $data['created_by'];
		$val->created_ts = $data['created_ts'];
		$val->title = $data['title'];
		$val->scaffold = $data['scaffold'];
		if (isset($data['data'])){
			$val->data = $data['data'];
		}
		else{
			$val->data = array();
		}
		$val->type = $key->s_type;
		
		$val->save();
		
		return $val;
    }
}