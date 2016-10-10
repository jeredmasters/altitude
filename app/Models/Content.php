<?php


class Content extends BaseModel {
	protected $table = 'content';
	protected $array = array('path','related_to');

	public static function storageLocation(){
		return storage_path() . '/uploads';
	}

	public static function indexFile($file, $context = null, $relatedTo = array()){

		$name = date('Ymd') . '_' .Str::random(20) . '_' . $file->getClientOriginalName();

		if ($context == null){
			//$context = AppSession::getParams();
		}
		if (!is_array($relatedTo)){
			$relatedTo = array($relatedTo);
		}

		$path = array(date('Y'),$context->company);

		$dir = static::storageLocation() . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $path);

		$file->move($dir, $name);

		$asset = new Content;
		$asset->name = $name;
		$asset->path = $path;
		$asset->full_path = $dir . DIRECTORY_SEPARATOR . $name ;
		$asset->original_name = $file->getClientOriginalName();
		$asset->size = $file->getClientSize();
		$asset->user = $context->id;
		$asset->company = $context->company;
		$asset->mime_type = $file->getClientMimeType();
		$asset->related_to = $relatedTo;

		$asset->save();
		return $asset->id;
	}

	public function getPath(){
		return static::storageLocation() . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR,$this->path) . DIRECTORY_SEPARATOR . $this->name;
	}
	
}
